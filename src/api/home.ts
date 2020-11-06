import { FetchConfig } from '@/utils/service/httpRequest'
import axios from '@/utils/service/axios'

export const getList = (query?: any, config?: FetchConfig) => axios.get('/api/list', query, config)
