export const studentColors = [
  '#D1D2F9',
  '#BAC7F9',
  '#A3BCF9',
  '#8DA9E2',
  '#7796CB',
  '#677DAE',
  '#576490',
  '#66729A',
  '#818BAB',
  '#AFDBF5',
  '#00356B',
  '#013A63',
  '#01497C',
  '#2C7DA0',
  '#468FAF',
  '#61A5C2',
  '#89C2D9',
  '#A9D6E5'
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getColorForStudent(id: string): string {
  const index = hashString(id) % studentColors.length
  return studentColors[index]
}
