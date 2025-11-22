export function calculateHandValue(hand) {
    let { value, aces } = hand.reduce(
        (acc, card) => {
            if (card.value === 'A') {
                acc.aces += 1;
                acc.value += 11;
            } else if (['K', 'Q', 'J'].includes(card.value) || card.value === 10) {
                acc.value += 10;
            } else {
                acc.value += parseInt(card.value, 10);
            }
            return acc;
        },
        { value: 0, aces: 0 }
    );

    // Ajuste les as (11 => 1 si nécessaire)
    while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
    }

    return value;
}
