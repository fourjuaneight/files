/**
 * Convert record name into a filename ready for upload.
 * @function
 *
 * @param {string} name record name
 * @returns {string} record filename
 */
export const fileNameFmt = (name: string): string => {
  const cleanName: string = name
    .replace(/^\s/g, '')
    .replace(/\.$/g, '')
    .replace(/\.\s/g, '-')
    .replace(/,\s/g, '-')
    .replace(/\s::\s/g, '-')
    .replace(/\s:\s/g, '-')
    .replace(/:\s/g, '-')
    .replace(/\s-\s/g, '-')
    .replace(/\s--\s/g, '-')
    .replace(/\s–\s/g, '-')
    .replace(/\s––\s/g, '-')
    .replace(/\s—\s/g, '-')
    .replace(/\s——\s/g, '-')
    .replace(/…\s/g, '_')
    .replace(/[-|\\]+/g, '-')
    .replace(/\s&\s/g, 'and')
    .replace(/&/g, 'n')
    .replace(/[!@#$%^*()+=[\]{};'’:"”“,.<>/?]+/g, '')
    .replace(/\s/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]+/g, '')
    .replace(/[\u202a-\u202c]+/g, '');

  return cleanName;
};
