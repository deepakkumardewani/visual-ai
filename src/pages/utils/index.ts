export interface ImageObject {
  userId: string
  prompt: string
  featureType: string
  imageUrl: string
  original: string
  enhanced: string
  humanReadableDate: string
  isFavorite: string
  resolution: string
  createdAt: string
  width: number
  height: number
  format: string
  bytes: number
  _id: string
}

export interface GroupedObject {
  title: string
  data: ImageObject[]
}

export function groupByDate(data: ImageObject[]): GroupedObject[] {
  const grouped: { [key: string]: ImageObject[] } = {}

  // Group objects by humanReadableDate
  data.forEach((item) => {
    const date = item.humanReadableDate
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(item)
  })

  // Convert the grouped data into the desired format
  const result: GroupedObject[] = Object.keys(grouped).map((date) => ({
    title: formatDate(date), // Formatting date to desired format like "08 Oct"
    data: grouped[date]
  }))

  return result
}

function formatDate(date: string): string {
  console.log(date)
  // Assuming the input date is in "MM/DD/YYYY" format
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  const [month, day] = date.split('/')

  // Convert month number to month name (zero-indexed)
  const monthName = months[parseInt(month, 10) - 1]

  return `${day} ${monthName}`
}

const data: ImageObject[] = []

const groupedArray = groupByDate(data)
console.log(groupedArray)
