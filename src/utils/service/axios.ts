import { baseURLMap } from "@/config"
import HttpRequest from "./httpRequest"

/**
 * 获取基地址
 * @param env {string} 环境
 */
export const getBaseURL = (env: string): string => baseURLMap[env] || '/'

const baseURL: string = getBaseURL(process.env.NODE_ENV)

const axios = new HttpRequest(baseURL)

export default axios
