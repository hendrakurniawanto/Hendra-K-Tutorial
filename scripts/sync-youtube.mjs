import { writeFile } from "node:fs/promises";

const apiKey = process.env.YOUTUBE_API_KEY;
const channelHandle = process.env.YOUTUBE_CHANNEL_HANDLE || "@hendra.k";
const minimumDurationSeconds = Number(process.env.YOUTUBE_MIN_DURATION_SECONDS || 240);
const outputPath = "youtube-posts.json";

async function request(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [key, value] of Object.entries({ ...params, key: apiKey })) url.searchParams.set(key, value);
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `YouTube API gagal (${response.status}).`);
  return data;
}

function parseDuration(duration) {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function formatReadTime(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} MENIT`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(value))
    .toUpperCase();
}

async function main() {
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY belum diatur; feed video dibuat kosong.");
    await writeFile(outputPath, "[]\n");
    return;
  }

  const channelData = await request("channels", { part: "id,contentDetails", forHandle: channelHandle });
  const channelId = channelData.items?.[0]?.id;
  if (!channelId) throw new Error(`Channel YouTube ${channelHandle} tidak ditemukan.`);
  const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error(`Playlist upload channel ${channelHandle} tidak ditemukan.`);

  const uploadsData = await request("playlistItems", {
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: "50",
  });
  const videoIds = uploadsData.items.map((item) => item.contentDetails?.videoId).filter(Boolean);
  if (!videoIds.length) {
    await writeFile(outputPath, "[]\n");
    return;
  }

  const videoData = await request("videos", {
    part: "snippet,contentDetails,liveStreamingDetails",
    id: videoIds.join(",")
  });
  const posts = videoData.items
    .map((video) => ({ video, durationSeconds: parseDuration(video.contentDetails?.duration || "PT0S") }))
    .filter(({ video, durationSeconds }) => (
      video.snippet?.liveBroadcastContent === "none"
      && !video.liveStreamingDetails
      && durationSeconds >= minimumDurationSeconds
    ))
    .map(({ video, durationSeconds }) => ({
      id: `youtube-${video.id}`,
      title: video.snippet.title,
      category: "Video",
      date: formatDate(video.snippet.publishedAt),
      readTime: formatReadTime(durationSeconds),
      description: video.snippet.description.slice(0, 220),
      image: video.snippet.thumbnails?.high?.url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      alt: `Thumbnail video YouTube: ${video.snippet.title}`,
      youtubeId: video.id,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      content: [{ heading: "Tonton video", text: `Video ini tersedia di YouTube: ${`https://www.youtube.com/watch?v=${video.id}`}` }],
      createdAt: Date.parse(video.snippet.publishedAt)
    }))
    .sort((first, second) => second.createdAt - first.createdAt);

  await writeFile(outputPath, `${JSON.stringify(posts, null, 2)}\n`);
  console.log(`Disinkronkan ${posts.length} video panjang dari ${channelHandle}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
