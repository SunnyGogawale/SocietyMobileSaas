export function success(data, meta) {
  return meta ? { data, meta } : { data }
}