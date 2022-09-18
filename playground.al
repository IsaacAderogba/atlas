interface CartesianVector {
  type: String
  x: Number
  y: Number
}

interface PolarVector {
  type: String
  angle: Number
  magnitude: Number
}

type Vector = CartesianVector | PolarVector

var vector: Vector = {}