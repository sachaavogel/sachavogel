export const calculateStreak = (practiceDates) => {
  if (!practiceDates || practiceDates.length === 0) return 0
  const sorted = [...practiceDates].sort((a, b) => b.localeCompare(a))

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (sorted[0] === today) {
    return countConsecutive(sorted, today)
  } else if (sorted[0] === yesterday) {
    return countConsecutive(sorted, yesterday)
  } else {
    return 0
  }
}

const countConsecutive = (sortedDesc, startDate) => {
  let count = 0
  let current = new Date(startDate)

  for (let i = 0; i < sortedDesc.length; i++) {
    const dateStr = current.toISOString().split('T')[0]
    if (sortedDesc[i] === dateStr) {
      count++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }

  return count
}

export const calculateLongestStreak = (dates) => {
  if (!dates || dates.length === 0) return 0
  const uniqueDates = [...new Set(dates)].sort()
  let longest = 0
  let current = 0
  let prev = null

  for (let i = 0; i < uniqueDates.length; i++) {
    const dateStr = uniqueDates[i]
    if (prev === null) {
      current = 1
    } else {
      const prevDate = new Date(prev)
      const currDate = new Date(dateStr)
      const diff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        current++
      } else if (diff > 1) {
        if (current > longest) longest = current
        current = 1
      }
    }
    prev = dateStr
    if (i === uniqueDates.length - 1) {
      if (current > longest) longest = current
    }
  }

  return longest
}
