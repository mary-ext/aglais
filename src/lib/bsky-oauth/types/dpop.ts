export interface DPoPKey {
	key: CryptoKey;
	jwt: { typ: 'dpop+jwt'; alg: string; jwk: JsonWebKey };
}
