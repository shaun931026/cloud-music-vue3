interface BaseURLMap {
  production: string
  development: string
  test: string
  [prop: string]: string
}

export const baseURLMap: BaseURLMap = {
  production: '/',
  development: 'http://localhost:3000',
  test: 'http://localhost:3001'
}
