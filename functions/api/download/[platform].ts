export async function onRequestGet(context: {
  request: Request;
  params: { platform: string };
}) {
  const platform = (context.params.platform || '').toLowerCase();
  const url = new URL(context.request.url);

  let targetPath = '';
  switch (platform) {
    case 'android':
    case 'apk':
      targetPath = '/downloads/study-buddy-ai.apk';
      break;
    case 'windows':
    case 'pc':
    case 'exe':
      targetPath = '/downloads/study-buddy-ai-setup.exe';
      break;
    case 'windows-portable':
    case 'pc-portable':
    case 'zip':
      targetPath = '/downloads/study-buddy-ai-windows.zip';
      break;
    case 'source':
      targetPath = '/downloads/study-buddy-ai-source.zip';
      break;
    default:
      return new Response(JSON.stringify({ error: `Unknown download platform: ${platform}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
  }

  const redirectUrl = new URL(targetPath, url.origin);
  return Response.redirect(redirectUrl.toString(), 302);
}
