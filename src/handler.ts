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

  try {
    const key = request.headers.get('key');
    const name = request.headers.get('name');
    const folder = request.headers.get('folder');
    const file = await request.arrayBuffer();

    // check for required fields
    switch (true) {
      case !name:
        return new Response(
          JSON.stringify({ error: "Missing 'Name' header." }),
          badReqBody
        );
      case !file:
        return new Response(
          JSON.stringify({ error: 'Missing file.' }),
          badReqBody
        );
      case !key:
        return new Response(
          JSON.stringify({ error: "Missing 'Key' header." }),
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
        const url = await getMediaUrl(name as string, file, folder || 'Shelf');

        return new Response(url, responseInit);
      }
    }
  } catch (error) {
    console.log('handleRequest', error);
    return new Response(JSON.stringify({ error }), errReqBody);
  }
};
