import { fileNameFmt } from './fileNameFmt';

import {
  B2AuthResp,
  B2AuthTokens,
  B2Error,
  B2UploadResp,
  B2UploadTokens,
  B2UpUrlResp,
} from './typings.d';

/**
 * Create SHA1 hash of file.
 * @function
 * @async
 *
 * @param data file to encode
 * @returns {Promise<string>} hash of file
 */
const createHash = async (data: ArrayBuffer) => {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;
  } catch (error) {
    console.log('createHash', error);
    throw `Creating hash:\n${error}`;
  }
};

/**
 * Authorize B2 bucket for upload.
 * docs: https://www.backblaze.com/b2/docs/b2_authorize_account.html
 * @function
 * @async
 *
 * @returns {Promise<B2AuthTokens>} api endpoint, auth token, and download url
 */
const authTokens = async (): Promise<B2AuthTokens> => {
  try {
    const token = Buffer.from(`${B2_APP_KEY_ID}:${B2_APP_KEY}`).toString(
      'base64'
    );
    const options = {
      headers: {
        Authorization: `Basic ${token}`,
      },
    };
    const response = await fetch(
      'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
      options
    );

    if (response.status !== 200) {
      const results: B2Error = await response.json();
      const msg = results.message || results.code;

      console.log(msg);
      throw `Getting B2 authentication keys: \n ${results.status}: ${msg}`;
    }

    const results: B2AuthResp = await response.json();
    const data: B2AuthTokens = {
      apiUrl: results.apiUrl,
      authorizationToken: results.authorizationToken,
      downloadUrl: results.downloadUrl,
      recommendedPartSize: results.recommendedPartSize,
    };

    return data;
  } catch (error) {
    console.log('authTokens', error);
    throw `Getting B2 authentication keys: \n ${error}`;
  }
};

/**
 * Get B2 endpoint for upload.
 * docs: https://www.backblaze.com/b2/docs/b2_get_upload_url.html
 * @function
 * @async
 *
 * @returns {Promise<B2UploadTokens>} upload endpoint, auth token, and download url
 */
const getUploadUrl = async (): Promise<B2UploadTokens> => {
  try {
    const authData = await authTokens();
    const options = {
      method: 'POST',
      headers: {
        Authorization: authData?.authorizationToken ?? '',
      },
      body: JSON.stringify({
        bucketId: B2_BUCKET_ID,
      }),
    };
    const response = await fetch(
      `${authData?.apiUrl}/b2api/v1/b2_get_upload_url`,
      options
    );

    if (response.status !== 200) {
      const results: B2Error = await response.json();
      const msg = results.message || results.code;

      console.log(msg);
      throw `Getting B2 upload URL: \n ${response.status}: ${msg}`;
    }

    const results: B2UpUrlResp = await response.json();
    const endpoint = results.uploadUrl;
    const authToken = results.authorizationToken;

    return {
      endpoint,
      authToken,
      downloadUrl: authData?.downloadUrl ?? '',
    };
  } catch (error) {
    console.log('getUploadUrl', error);
    throw `Getting B2 upload URL: \n ${error}`;
  }
};

/**
 * Upload file to B2 bucket.
 * docs: https://www.backblaze.com/b2/docs/b2_upload_file.html
 * @function
 * @async
 *
 * @param {ArrayBuffer} data file buffer
 * @param {string} name file name with extension
 * @param {string} [type] file type
 * @returns {Promise<string>} file public url
 */
const uploadToB2 = async (
  data: ArrayBuffer,
  name: string,
  type?: string
): Promise<string> => {
  try {
    const authData = await getUploadUrl();
    const hash = await createHash(data);
    const options: RequestInit = {
      method: 'POST',
      headers: {
        Authorization: authData?.authToken ?? '',
        'X-Bz-File-Name': name,
        'Content-Type': type || 'b2/x-auto',
        'Content-Length': `${data.length}`,
        'X-Bz-Content-Sha1': hash,
        'X-Bz-Info-Author': 'gh-action',
      },
      body: data,
    };
    const response = await fetch(authData?.endpoint ?? '', options);

    if (response.status !== 200) {
      const results: B2Error = await response.json();
      const msg = results.message || results.code;

      console.log(msg);
      throw `Uploading file to B2 - ${name}: \n ${results.status}: ${msg}`;
    }

    const results: B2UploadResp = await response.json();

    return `${authData?.downloadUrl}/file/${B2_BUCKET_NAME}/${results.fileName}`;
  } catch (error) {
    console.log('uploadToB2', error);
    throw `Uploading file to B2 - ${name}: \n ${error}`;
  }
};

export const getMediaUrl = async (
  name: string,
  ext: string,
  data: ArrayBuffer
): Promise<string> => {
  try {
    const fileName = fileNameFmt(name);
    const coverUrl = await uploadToB2(data, `Shelf/${fileName}.${ext}`);

    return coverUrl;
  } catch (error) {
    console.log('getMediaUrl', error);
    throw `${error}`;
  }
};
