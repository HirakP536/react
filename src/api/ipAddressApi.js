export const getUserIp = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (err) {
    console.error('Failed to fetch IP', err);
    return null;
  }
};