import { BrowserWindow, session } from 'electron'

/**
 * Initialize ad blocking.
 * Uses Electron's webRequest API to block known ad domains and strip frame restrictions.
 */
export function initAdBlocker(window?: BrowserWindow): void {
  const targetSession = window?.webContents ? window.webContents.session : session.defaultSession

  const filter = {
    urls: [
      '*://*.doubleclick.net/*',
      '*://*.googlesyndication.com/*',
      '*://*.googleadservices.com/*',
      '*://*.google-analytics.com/*',
      '*://*.adservice.google.com/*',
      '*://pagead2.googlesyndication.com/*',
      '*://*.youtube.com/pagead/*',
      '*://*.youtube.com/api/stats/ads*',
      '*://*.youtube.com/ptracking*',
      '*://*.youtube.com/get_midroll*',
      '*://*.googlevideo.com/videoplayback*adtags*',
      '*://*.moatads.com/*',
      '*://*.adnxs.com/*',
      '*://*.adsystem.com/*',
      '*://*.advertising.com/*',
      '*://*.taboola.com/*',
      '*://*.outbrain.com/*',
      '*://*.criteo.com/*',
      '*://*.amazon-adsystem.com/*'
    ]
  }

  targetSession.webRequest.onBeforeRequest(filter, (_details, callback) => {
    callback({ cancel: true })
  })

  // Block ad tracking headers and strip framing restrictions for YouTube embeds
  targetSession.webRequest.onHeadersReceived(
    { urls: ['*://*/*'] },
    (details, callback) => {
      const headers = { ...details.responseHeaders }
      delete headers['X-Ads-Tracking']
      delete headers['x-ads-tracking']

      const url = details.url.toLowerCase()
      if (url.includes('youtube.com') || url.includes('youtube-nocookie.com')) {
        delete headers['x-frame-options']
        delete headers['X-Frame-Options']
        delete headers['frame-options']
        if (headers['content-security-policy']) {
          headers['content-security-policy'] = headers['content-security-policy'].map((csp) =>
            csp.replace(/frame-ancestors[^;]*;?/gi, '')
          )
        }
      }

      callback({ responseHeaders: headers })
    }
  )
}
