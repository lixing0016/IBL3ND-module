export default async function(ctx) {
  const data = await ctx.response.json();
  if (data?.data?.confList) {
    delete data.data.confList.Minor_mode_card;
  }
  return { body: data };
}
