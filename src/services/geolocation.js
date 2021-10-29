const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "google",
  apiKey: process.env.GOOGLE_API_KEY, // for Mapquest, OpenCage, Google Premier
  formatter: null, // 'gpx', 'string', ...
};

async function returnObjectOfMaps(street) {
  console.log(options);
  console.log(street);
  const geocoder = NodeGeocoder(options);
  const res = await geocoder.geocode(street);
  console.log(res);
  return res[0];
}
module.exports = returnObjectOfMaps;
