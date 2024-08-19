export type CropResult = [offsetX: number, offsetY: number, width: number, height: number];
export type CropFunction = (pW: number, pH: number, cW: number, cH: number) => CropResult;

export const contain = (pW: number, pH: number, cW: number, cH: number): CropResult => {
	const cR = cW / cH;
	const pR = pW / pH;

	let w = pW;
	let h = pH;

	if (cR > pR) {
		h = w / cR;
	} else {
		w = h * cR;
	}

	return [(pW - w) * 0.5, (pH - h) * 0.5, w, h];
};

export const cover = (pW: number, pH: number, cW: number, cH: number): CropResult => {
	const cR = cW / cH;
	const pR = pW / pH;

	let w = pW;
	let h = pH;

	if (cR < pR) {
		h = w / cR;
	} else {
		w = h * cR;
	}

	return [(pW - w) * 0.5, (pH - h) * 0.5, w, h];
};
