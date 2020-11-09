import { FetchConfig } from '@/utils/service/httpRequest'
import axios from '@/utils/service/axios'

interface LoginByPhoneQuery {
  phone: string
  password: string
  countrycode?: string
  md5_password?: string
}

interface LoginByEmailQuery {
  email: string
  password: string
  md5_password?: string
}

export const loginByPhone = (query: LoginByPhoneQuery, config?: FetchConfig) =>
  axios.get('/login/cellphone', query, config)
export const loginByEmail = (query: LoginByEmailQuery, config?: FetchConfig) =>
  axios.get('/login', query, config)
