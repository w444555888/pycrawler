// 轉換ISO 8601 Duration格式
const formatDuration = (isoDuration) => {
    if (!isoDuration || typeof isoDuration !== 'string') return 'N/A'

    const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
    const matches = isoDuration.match(regex)

    if (!matches) return isoDuration

    const [, years, months, days, hours, minutes, seconds] = matches
    const parts = []

    if (years) parts.push(`${years}年`)
    if (months) parts.push(`${months}月`)
    if (days) parts.push(`${days}天`)
    if (hours) parts.push(`${hours}小時`)
    if (minutes) parts.push(`${minutes}分鐘`)
    if (seconds) parts.push(`${seconds}秒`)

    return parts.length > 0 ? parts.join(' ') : 'N/A'
}

export default formatDuration;