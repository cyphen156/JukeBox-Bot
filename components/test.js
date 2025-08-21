const { resolveVideo } = require('../components/youtube/youtube.js');

async function runTest(textInput, urlInput, ctx)
{
    const defaultText = 'antifreeze';
    const defaultUrl = 'https://www.youtube.com/watch?v=gGfFoIDXnS8&list=RD74_yqNBhQbA&index=2';

    const text = typeof textInput === 'string' && textInput.length > 0 ? textInput : defaultText;
    const url = typeof urlInput === 'string' && urlInput.length > 0 ? urlInput : defaultUrl;

    const stamp = new Date().toISOString();

    console.log('========================================');
    console.log('[TEST] TIMESTAMP:', stamp);

    if (ctx && ctx.user)
    {
        console.log('[TEST] USER:', `${ctx.user.tag} (${ctx.user.id})`);
    }

    if (ctx && ctx.guild)
    {
        console.log('[TEST] GUILD:', `${ctx.guild.name} (${ctx.guild.id})`);
    }

    console.log('[TEST] TEXT_INPUT:', text);
    console.log('[TEST] URL_INPUT :', url);

    // TEXT
    let textResult = null;
    let textError = null;

    try
    {
        textResult = await resolveVideo(text);
        console.log('[TEST] TEXT_RESOLVED:', textResult);
    }
    catch (e)
    {
        textError = { code: e?.code || 'UNKNOWN', message: e?.message || String(e) };
        console.error('[TEST] TEXT_ERROR:', textError);
    }

    // URL
    let urlResult = null;
    let urlError = null;

    try
    {
        urlResult = await resolveVideo(url);
        console.log('[TEST] URL_RESOLVED:', urlResult);
    }
    catch (e)
    {
        urlError = { code: e?.code || 'UNKNOWN', message: e?.message || String(e) };
        console.error('[TEST] URL_ERROR:', urlError);
    }

    return {
        inputs:
        {
            text,
            url
        },
        text:
        {
            ok: textResult !== null,
            result: textResult,
            error: textError
        },
        url:
        {
            ok: urlResult !== null,
            result: urlResult,
            error: urlError
        }
    };
}

module.exports =
{
    runTest
};