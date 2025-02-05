# Participation model

This document defines the participation model for the bApp, including token and validator balance usage, the combination function, and the opt-in data format.

## Token and Validator Balance

The bApp uses the `SSV` token assigned with a `sharedRiskLevel` ($\beta$) value of 2.0.
Off-chain, the bApp will also use the strategies' validator balance.

## Combination function

As combination function, the bApp uses a harmonic mean in which SSV carries twice the weight of validator balance. I.e.

$$W_{\text{strategy}}^{\text{final}} = c_{\text{final}} \times \frac{1}{\frac{2/3}{W_{\text{strategy, SSV}}} + \frac{1/3}{W_{\text{strategy, VB}}}}$$

where $c_{\text{final}}$ is a normalization constant computed as

$$c_{\text{final}} = \left( \sum_{\text{strategy}} \frac{1}{\frac{2/3}{W_{\text{strategy, A}}} + \frac{1/3}{W_{\text{strategy, B}}}} \right)^{-1}$$

## Opt-in Data

A strategy opting into the bApp must set the `data` field to the UTF-8 encoded JSON object:

```json
{
    "pubkey": HEX(PUBKEY),
    "signature": HEX(ED25519_SIGN(SHA512(BAPP_ADDRESS), PRIVKEY)),
}
```

where:
- `HEX` denotes hex encoding.
- `PUBKEY` is the strategy's ED25519 public key.
- `ED25519_SIGN` signs a message using an ED25519 private key.
- `SHA512` is the SHA-512 hash function.
- `BAPP_ADDRESS` is the address of the bApp.
- `PRIVKEY` if the strategy's ED25519 private key.

