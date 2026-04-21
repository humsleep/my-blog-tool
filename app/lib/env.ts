const cache: Record<string, string> = {};

function read(name: string): string {
  if (cache[name]) return cache[name];
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `환경변수 ${name}이(가) 설정되지 않았습니다. .env.local 파일을 확인하세요.`
    );
  }
  cache[name] = value;
  return value;
}

function readOptional(name: string): string | undefined {
  if (cache[name]) return cache[name];
  const value = process.env[name];
  if (!value) return undefined;
  cache[name] = value;
  return value;
}

export const env = {
  get naverSearchAdApiKey() {
    return read('NAVER_SEARCH_AD_API_KEY');
  },
  get naverSearchAdSecretKey() {
    return read('NAVER_SEARCH_AD_SECRET_KEY');
  },
  get naverSearchAdCustomerId() {
    return read('NAVER_SEARCH_AD_CUSTOMER_ID');
  },
  get naverClientId() {
    return read('NAVER_CLIENT_ID');
  },
  get naverClientSecret() {
    return read('NAVER_CLIENT_SECRET');
  },
  get pexelsApiKey() {
    return readOptional('PEXELS_API_KEY');
  },
  get unsplashAccessKey() {
    return readOptional('UNSPLASH_ACCESS_KEY');
  },
};
