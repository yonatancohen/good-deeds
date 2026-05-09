// Vercel serverless function — redirects to the latest EAS Update on a given
// channel. Lets us hand teachers a single stable URL like:
//
//   https://<your-vercel-domain>/install
//   https://<your-vercel-domain>/install?channel=preview
//
// The function calls Expo's GraphQL API to find the most recent update group
// on that channel, then 302-redirects to the canonical share URL. We never
// have to update anything by hand — every `eas update --branch X` is picked
// up automatically on the next visit.
//
// Required Vercel env var: EXPO_TOKEN (an Expo personal access token with
// read access to the project — same token used for `eas login` automation).

const PROJECT_ID = "90100a76-6a01-41ca-8407-c39174787046";

const QUERY = `
  query LatestUpdateOnChannel($appId: String!, $channelName: String!) {
    app {
      byId(appId: $appId) {
        updateChannelByName(name: $channelName) {
          updateBranches(offset: 0, limit: 1) {
            name
            updates(offset: 0, limit: 1) {
              id
              group
              createdAt
              message
            }
          }
        }
      }
    }
  }
`;

export default async function handler(req, res) {
  const channel = (req.query.channel || "production").toString();
  const token = process.env.EXPO_TOKEN;

  if (!token) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    return res
      .status(500)
      .send(
        "Server is missing EXPO_TOKEN. Add it in Vercel → Project → Settings → Environment Variables."
      );
  }

  try {
    const response = await fetch("https://api.expo.dev/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { appId: PROJECT_ID, channelName: channel },
      }),
    });

    if (!response.ok) {
      return res
        .status(502)
        .send(`Expo API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();

    if (data.errors?.length) {
      return res
        .status(502)
        .send(
          "Expo GraphQL errors: " +
            data.errors.map((e) => e.message).join("; ")
        );
    }

    const update =
      data?.data?.app?.byId?.updateChannelByName?.updateBranches?.[0]
        ?.updates?.[0];

    if (!update?.group) {
      return res
        .status(404)
        .send(
          `No update found on channel "${channel}". Run \`eas update --branch ${channel}\` first.`
        );
    }

    const target = `https://expo.dev/preview/update?projectId=${PROJECT_ID}&group=${encodeURIComponent(
      update.group
    )}`;

    // Cache the redirect for 60 seconds so we don't hammer the Expo API on
    // every click. Anyone who installs within 60s of an `eas update` will
    // still get the latest one within a minute.
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
    res.redirect(302, target);
  } catch (err) {
    res
      .status(500)
      .send(`Failed to look up latest update: ${err?.message || err}`);
  }
}
