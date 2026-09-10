const assert = require('node:assert/strict')
const test = require('node:test')
const vm = require('node:vm')
const launcher = require('../pinokio')
const install = require('../install')
const update = require('../update')

function enabled(step, files, platform = 'win32') {
  if (!step.when) return true
  return vm.runInNewContext(step.when.slice(2, -2), {
    platform, exists: path => files.has(path)
  })
}

function menu(files = [], running = [], local) {
  return launcher.menu({}, {
    exists: path => files.includes(path),
    running: path => running.includes(path),
    local: () => local
  })
}

test('failed installs can retry without cloning over the existing app', () => {
  const clone = install.run.find(step => JSON.stringify(step).includes('git clone'))
  assert.equal(enabled(clone, new Set()), true)
  assert.equal(enabled(clone, new Set(['app', 'app/env'])), false)
})

test('readiness is cleared before repair and published only after all install steps', () => {
  const files = new Set(['app', 'app/env', 'app/.installed'])
  assert.equal(enabled(install.run[0], files), true)
  assert.equal(install.run[0].method, 'fs.rm')
  assert.equal(install.run[0].params.path, 'app/.installed')
  const last = install.run.at(-1)
  assert.equal(last.method, 'fs.write')
  assert.equal(last.params.path, 'app/.installed')
  assert.equal(enabled(install.run[0], new Set()), false)
})

test('updates reuse the complete installer on every platform', () => {
  for (const platform of ['win32', 'linux', 'darwin']) {
    const steps = update.run.filter(step => enabled(step, new Set(['app/.git']), platform))
    assert.equal(steps.at(-1).method, 'script.start')
    assert.equal(steps.at(-1).params.uri, 'install.js')
    assert.equal(steps.filter(step => step.method === 'shell.run').length, 2)
  }
  assert.equal(enabled(update.run[1], new Set()), false)
})

test('partial and legacy installs offer repair instead of Start', async () => {
  for (const files of [[], ['app'], ['app', 'app/env'], ['app', 'app/.installed']]) {
    const items = await menu(files)
    assert.equal(items[0].href, 'install.js')
    assert.equal(items[0].default, true)
    assert.equal(items.some(item => item.href === 'start.js'), false)
    assert.equal(items.some(item => item.href === 'reset.js'), files.includes('app'))
  }
})

test('maintenance remains visible while files disappear or nested install runs', async () => {
  for (const action of ['install', 'update', 'reset']) {
    const items = await menu([], [`${action}.js`])
    assert.equal(items.length, 1)
    assert.equal(items[0].href, `${action}.js`)
  }
  assert.equal((await menu([], ['update.js', 'install.js']))[0].href, 'update.js')
})

test('completed installs transition from Start to terminal to Web UI', async () => {
  const files = ['app', 'app/env', 'app/.installed']
  assert.equal((await menu(files))[0].text, 'Start')
  assert.equal((await menu(files, ['start.js']))[0].text, 'Terminal')
  const items = await menu(files, ['start.js'], { url: 'http://127.0.0.1:7860' })
  assert.equal(items[0].href, 'http://127.0.0.1:7860')
  assert.equal(items[0].default, true)
})
