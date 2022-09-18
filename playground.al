interface CartesianVector {
  y: Number
}

interface PolarVector {
  angle: Number
}

type Vector = CartesianVector | PolarVector

var vector: Vector = { 
  "type": "cartesian"
}