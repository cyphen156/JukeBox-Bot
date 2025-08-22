// components/youtube/youtube.js
// 입력(검색어/URL) -> 단일 유튜브 영상 { url, title, videoId }로 표준화
// 정책: URL 판별/ID 추출은 직접 처리, 메타 조회/검색은 play-dl만 사용(재생은 별도 파이프)

const playdl = require('play-dl');
const { URL } = require('node:url');

/**
 * 문자열이 URL이면 URL 객체 반환, 아니면 null
 */
function toUrl(u)
{
    try
    {
        return new URL(u);
    }
    catch (e)
    {
        return null;
    }
}

/**
 * 유튜브 호스트 판정
 */
function isYouTubeHost(host)
{
    if (!host)
    {
        return false;
    }

    const h = host.toLowerCase();

    if (h === 'youtube.com')
    {
        return true;
    }
    else if (h === 'www.youtube.com')
    {
        return true;
    }
    else if (h === 'm.youtube.com')
    {
        return true;
    }
    else if (h === 'music.youtube.com')
    {
        return true;
    }
    else if (h === 'youtu.be')
    {
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * 유튜브 URL에서 videoId / playlistId 추출
 */
function parseYouTubeIds(u)
{
    const url = toUrl(u);

    if (url === null)
    {
        return { videoId: null, playlistId: null };
    }

    if (!isYouTubeHost(url.hostname))
    {
        return { videoId: null, playlistId: null };
    }

    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    const params = url.searchParams;

    if (host === 'youtu.be')
    {
        const segs = path.split('/').filter(Boolean);
        const id = segs.length >= 1 ? segs[0] : null;
        return { videoId: id, playlistId: params.get('list') };
    }
    else if (path === '/watch')
    {
        return { videoId: params.get('v'), playlistId: params.get('list') };
    }
    else if (path.startsWith('/shorts/'))
    {
        const segs = path.split('/').filter(Boolean);
        const id = segs.length >= 2 ? segs[1] : null;
        return { videoId: id, playlistId: params.get('list') };
    }
    else if (path.startsWith('/embed/'))
    {
        const segs = path.split('/').filter(Boolean);
        const id = segs.length >= 2 ? segs[1] : null;
        return { videoId: id, playlistId: params.get('list') };
    }
    else if (path.startsWith('/live/'))
    {
        const segs = path.split('/').filter(Boolean);
        const id = segs.length >= 2 ? segs[1] : null;
        return { videoId: id, playlistId: params.get('list') };
    }
    else if (host === 'music.youtube.com' && path === '/watch')
    {
        return { videoId: params.get('v'), playlistId: params.get('list') };
    }
    else
    {
        const listOnly = params.get('list');

        if (listOnly !== null)
        {
            return { videoId: null, playlistId: listOnly };
        }
        else
        {
            return { videoId: null, playlistId: null };
        }
    }
}

/**
 * videoId -> 표준 watch URL
 */
function toWatchUrl(videoId)
{
    return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * 단일 영상 메타 조회 (play-dl 사용)
 */
async function fetchVideoMetaById(videoId)
{
    if (!videoId)
    {
        throw new Error('INVALID_VIDEO_ID');
    }

    const info = await playdl.video_info(toWatchUrl(videoId));
    const v = info !== null ? info.video_details : null;

    if (!v)
    {
        throw new Error('VIDEO_INFO_FAILED');
    }

    return { url: v.url, title: v.title, videoId: v.id || videoId };
}

/**
 * 검색어로 1건 조회 (play-dl 검색)
 */
async function searchOne(query)
{
    const results = await playdl.search(query, { source: { youtube: 'video' }, limit: 1 });

    if (!Array.isArray(results) || results.length === 0)
    {
        throw new Error('NO_RESULTS');
    }

    const r = results[0];
    const url = typeof r.url === 'string' ? r.url : '';
    const title = typeof r.title === 'string' && r.title.length > 0 ? r.title : url;
    const { videoId } = parseYouTubeIds(url);

    return { url: url, title: title, videoId: videoId || r.id || null };
}

/**
 * 입력(검색어/URL) → 단일 영상 해석
 */
async function resolveVideo(input, opts)
{
    const options = opts || {};
    const allowPlaylist = options.allowPlaylist === true;

    const url = toUrl(input);

    if (url !== null && isYouTubeHost(url.hostname))
    {
        const { videoId, playlistId } = parseYouTubeIds(input);

        if (videoId === null && playlistId !== null)
        {
            if (!allowPlaylist)
            {
                const err = new Error('PLAYLIST_URL_NOT_ALLOWED');
                err.code = 'PLAYLIST_URL_NOT_ALLOWED';
                err.playlistId = playlistId;
                throw err;
            }
            else
            {
                const err2 = new Error('PLAYLIST_HANDLING_NOT_IMPLEMENTED');
                err2.code = 'PLAYLIST_HANDLING_NOT_IMPLEMENTED';
                err2.playlistId = playlistId;
                throw err2;
            }
        }

        if (videoId !== null)
        {
            return await fetchVideoMetaById(videoId);
        }
        else
        {
            const bySearch = await searchOne(input);

            if (bySearch.videoId === null)
            {
                throw new Error('VIDEO_ID_NOT_FOUND');
            }
            return bySearch;
        }
    }
    else
    {
        const bySearch = await searchOne(input);

        if (bySearch.videoId === null)
        {
            throw new Error('VIDEO_ID_NOT_FOUND');
        }
        return bySearch;
    }
}

function streamVideo()
{

}

module.exports =
{
    resolveVideo,
    streamVideo,
    _internals:
    {
        toUrl,
        isYouTubeHost,
        parseYouTubeIds,
        fetchVideoMetaById,
        searchOne,
        toWatchUrl
    }
};