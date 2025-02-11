export type Obligation = {
  percentage: string
}

export type BApp = {
  id: string
  obligations: Obligation[]
}

export type Deposit = {
  depositAmount: string
  token: string
}

export type Balance = {
  id: string
  token: string
  riskValue: string
}

export type Delegator = {
  id: string
  validatorCount: string
}

export type Delegation = {
  delegator: Delegator
  percentage: string
}

export type Owner = {
  id: string
  delegators?: Delegation[]
}

export type Strategy = {
  id: string
  strategy: {
    bApps: BApp[]
    deposits: Deposit[]
    balances: Balance[]
    owner: Owner
  }
  obligations: {
    obligatedBalance: string
    percentage: string
    token: string
  }[]
}

export type BAppToken = {
  token: string
  totalObligatedBalance: string
  sharedRiskLevel: string
}

export type BAppData = {
  strategies: Strategy[]
  bAppTokens: BAppToken[]
  owner: {
    id: string
  }
}

export type ResponseData = {
  data: {
    bapp: BAppData
  }
}
