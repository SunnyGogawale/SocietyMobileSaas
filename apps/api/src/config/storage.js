import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env.js'

export function createStorageClient() {
  if (!env.S3_BUCKET) throw new Error('S3_BUCKET must be configured before storage is used.')
  return new S3Client({ region: env.S3_REGION })
}