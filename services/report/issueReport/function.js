const Log = require('../../../log')
const { parse } = require('json2csv')
const _ = require('lodash')

const MAX_ROWS_PER_BATCH = 5000

const delay = (ms)=>{
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{
      resolve()
    }, ms)
  })
}

const processDataInChunks = async (orgName, allRows, writeStream, startIdx) => {
  const endIdx = Math.min(startIdx + MAX_ROWS_PER_BATCH, allRows.length)
  const chunk = allRows.slice(startIdx, endIdx)

  try {
    if (chunk.length > 0) {
      const processedRows = chunk.map((row) => {
        row.processed_at = new Date().toISOString()
        return row
      })
      const csvData = parse(processedRows, { header: startIdx === 0 })
      writeStream.write(csvData + '\n')
      Log.info(`[ ${orgName}] | processDataInChunks| Appended data from index ${startIdx} to ${endIdx}`)

      if (endIdx < allRows.length) {
        await delay(1000)
        await processDataInChunks(orgName, allRows, writeStream, endIdx)
      }
    }
  } catch (error) {
    Log.error(`[ ${orgName}] | processDataInChunks | Error processing data at index ${startIdx}: ${error.message}`)
    throw error
  }
}

module.exports = {
  processDataInChunks
}