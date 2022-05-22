import { getMediaUrl } from './uploadContentB2';

// default responses
const responseInit = {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
};
const badReqBody = {
  status: 400,
  statusText: 'Bad Request',
  ...responseInit,
};
const errReqBody = {
  status: 500,
  statusText: 'Internal Error',
  ...responseInit,
};
const noAuthReqBody = {
  status: 401,
  statusText: 'Unauthorized',
  ...responseInit,
};

/**
 * Handler method for all requests.
 * @function
 * @async
 *
 * @param {Request} request request object
 * @returns {Promise<Response>} response object
 */
export const handleRequest = async (request: Request): Promise<Response> => {
  // POST requests only
  if (request.method !== 'POST') {
    return new Response(null, {
      status: 405,
      statusText: 'Method Not Allowed',
    });
  }

  // content-type check (required)
  if (!request.headers.has('content-type')) {
    return new Response(
      JSON.stringify({ error: "Please provide 'content-type' header." }),
      badReqBody
    );
  }

  const contentType = request.headers.get('content-type');

  if (contentType?.includes('multipart/form-data')) {
    const payload = await request.formData();
    const key = payload.get('key');
    const name = payload.get('name');
    const ext = payload.get('ext');
    const file = payload.get('file');

    // check for required fields
    switch (true) {
      case !name:
        return new Response(
          JSON.stringify({ error: "Missing 'name' parameter." }),
          badReqBody
        );
      case !ext:
        return new Response(
          JSON.stringify({ error: "Missing 'ext' parameter." }),
          badReqBody
        );
      case !file:
        return new Response(
          JSON.stringify({ error: "Missing 'file' parameter." }),
          badReqBody
        );
      case !key:
        return new Response(
          JSON.stringify({ error: "Missing 'key' parameter." }),
          noAuthReqBody
        );
      case key !== AUTH_KEY:
        return new Response(
          JSON.stringify({
            error: "You're not authorized to access this API.",
          }),
          noAuthReqBody
        );
      default: {
        try {
          const fileData = await (file as File).arrayBuffer();
          const url = await getMediaUrl(
            name as string,
            ext as string,
            fileData
          );

          return new Response(url, responseInit);
        } catch (error) {
          console.log(error);
          return new Response(JSON.stringify({ error }), errReqBody);
        }
      }
    }
  }

  // default to bad content-type
  return new Response(null, {
    status: 415,
    statusText: 'Unsupported Media Type',
  });
};
