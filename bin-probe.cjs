const fs = require('fs')
const buffer = fs.readFileSync('D:/downloads/larpsite/kairo-site/public/models/robot.glb')

const chunk0Len = buffer.readUInt32LE(12)
const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Len)
const json = JSON.parse(jsonStr)

console.log('meshes:', json.meshes.length)
console.log('accessors:', json.accessors.length)

console.log('\n=== Per-mesh AABBs (from accessor min/max after upright rotation) ===')
const UPRIGHT_X = 286.4788 * Math.PI / 180
function rx(p) {
  const c = Math.cos(UPRIGHT_X), s = Math.sin(UPRIGHT_X)
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c]
}

json.meshes.forEach((m, mi) => {
  let aabb = null
  m.primitives.forEach((p) => {
    const acc = json.accessors[p.attributes.POSITION]
    if (!acc) return
    if (!acc.min || !acc.max) return
    if (!aabb) aabb = { min: [...acc.min], max: [...acc.max] }
    else {
      for (let i = 0; i < 3; i++) {
        aabb.min[i] = Math.min(aabb.min[i], acc.min[i])
        aabb.max[i] = Math.max(aabb.max[i], acc.max[i])
      }
    }
  })
  if (aabb) {
    const c = [
      (aabb.min[0] + aabb.max[0]) / 2,
      (aabb.min[1] + aabb.max[1]) / 2,
      (aabb.min[2] + aabb.max[2]) / 2
    ]
    const r = rx(c)
    console.log(`mesh[${mi}] (${JSON.stringify(m.name || 'unnamed')}):`,
      `raw min=(${aabb.min.map(v => v.toFixed(2)).join(', ')})`,
      `max=(${aabb.max.map(v => v.toFixed(2)).join(', ')})`,
      `| raw center=(${c.map(v => v.toFixed(2)).join(', ')})`,
      `| upright center=(${r.map(v => v.toFixed(2)).join(', ')})`)
  } else {
    console.log(`mesh[${mi}] (${JSON.stringify(m.name || 'unnamed')}): no POSITION min/max`)
  }
})
