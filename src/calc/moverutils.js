export function getDeltaFactor(opponentLevel, selfLevel) {
    var deltaFactor = 1.0;
    var delta = opponentLevel = selfLevel;

        if (delta > 0) {
            const maxOver = 16;
            delta = Math.min(delta, (maxOver - 1));
            let radian = (Math.PI * delta) / (maxOver * 2.0);
            deltaFactor *= Math.cos(radian);
        }

    return deltaFactor;
}