import { getStrategyToken } from './app/util'
import { config, tokenMap } from './config'
import { BApp, Strategy, StrategyID, StrategyToken, Address, BAppToken } from './types/app-interface'
import { Table } from 'console-table-printer'

export const RED = '\x1b[31m'
export const GREEN = '\x1b[32m'
export const YELLOW = '\x1b[33m'
export const BLUE = '\x1b[34m'
export const MAGENTA = '\x1b[35m'
export const CYAN = '\x1b[36m'
export const RESET = '\x1b[0m'
export const colors = [RED, GREEN, YELLOW, BLUE, MAGENTA, CYAN]

// ============================== BApp Summary ==============================

// Logs a summary of the BApp
export function logBAppSummary(bApp: BApp, strategies: Strategy[]): void {
  // Summary table (address, number of strategies)
  const summaryTable = new Table({
    columns: [
      { name: 'Parameter', alignment: 'left', color: 'cyan' },
      { name: 'Value', alignment: 'right' },
    ],
    title: '📊 BApp Overview',
  })
  summaryTable.addRow({Parameter: 'Address', Value: bApp.address })
  summaryTable.addRow({Parameter: 'Strategies', Value: strategies.length })
  summaryTable.printTable()

  // Capital profile table (capital type, significance, shared risk level, total amount)
  const totalValidatorBalance = strategies.reduce((acc, s) => acc + s.validatorBalance, 0)
  const getTokenTotalAmount = (token: string) =>
    strategies.reduce((acc, s) => {
      const strategyToken = s.tokens.find((t: StrategyToken) => t.address === token)
      return (
        acc +
        (strategyToken
          ? (strategyToken.amount * strategyToken.obligationPercentage)
          : 0)
      )
    }, 0)

  const capitalProfileTable = new Table({
    columns: [
      { name: 'Capital', alignment: 'center', color: 'white' },
      { name: 'Significance', alignment: 'center', color: 'green' },
      { name: 'Shared Risk Level (β)', alignment: 'center', color: 'cyan' },
      { name: 'Total Amount', alignment: 'center', color: 'yellow' },
    ],
    title: '💲 Capital Profile',
  })

  bApp.tokens.forEach((token) => {
    const symbol = tokenMap[token.address.toLowerCase()].symbol || token.address
    const totalAmount = getTokenTotalAmount(token.address)
    capitalProfileTable.addRow({
      Capital: symbol + ' Token',
      Significance: token.significance,
      'Shared Risk Level (β)': token.sharedRiskLevel,
      'Total Amount': `${totalAmount.toLocaleString()} ${symbol}`,
    })
  })
  capitalProfileTable.addRow({
    Capital: 'Validator Balance',
    Significance: bApp.validatorBalanceSignificance,
    'Shared Risk Level (β)': '-',
    'Total Amount': `${totalValidatorBalance.toLocaleString()} ETH`,
  })
  capitalProfileTable.printTable()

  console.log('\n')
  console.log('\n')
}


// ============================== Weight Logging ==============================

// Longest formula line for consistent formatting
const LEN = 95;

function padLine(content: string, length: number = LEN): string {
  const padding = length - content.length;
  return content + " ".repeat(padding) + "|";
}

function centerText(text: string, length: number = LEN): string {
  const padding = Math.max(0, (length - text.length) / 2);
  return " ".repeat(Math.floor(padding)) + text + " ".repeat(Math.ceil(padding));
}

function printDivision(): void {
  console.log("|"+"=".repeat(LEN-1)+"|");
}

function headerText(text: string): void {
  console.log(`|${CYAN}${centerText(text, LEN - 1)}${RESET}|`);
}

export function logCombinationFunction(useHarmonicCombination: boolean): void {
  console.log("\n")

  printDivision()
  if (useHarmonicCombination) {
    headerText(`COMBINATION FUNCTION (FINAL WEIGHT) (Harmonic Mean)`)
    printDivision()
    console.log(padLine("|                                           1"));
    console.log(padLine("| W_strategy^final  =  --------------------------------------"));
    console.log(padLine("|                     ( Σ (Significance_token / Weight_strategy,token)"));
    console.log(padLine("|                     + (Significance_ValidatorBalance / Weight_strategy,ValidatorBalance) )"));
  } else {
    headerText(`COMBINATION FUNCTION (FINAL WEIGHT) (Arithmetic Mean)`)
    printDivision()
    console.log(padLine("| W_strategy^final  =  ( Σ Weight_strategy,token * Significance_token )"));
    console.log(padLine("|                     + Weight_strategy,ValidatorBalance * Significance_ValidatorBalance"));
  }

  printDivision()
  console.log("\n");
}


export function logWeightFormula(useExponentialWeight: boolean): void {
  printDivision()
  if (useExponentialWeight) {
    headerText(`TOKEN WEIGHT FORMULA (Exponential)`)
    printDivision()
    console.log(padLine("|                  ObligatedBalance"));
    console.log(padLine("| W_strategy,token = ------------------ * e^(-β * max(1, Risk))"));
    console.log(padLine("|                     TotalAmount"));
  } else {
    headerText(`TOKEN WEIGHT FORMULA (Polynomial)`)
    printDivision()
    console.log(padLine("|                      ObligatedBalance              1 "));
    console.log(padLine("| W_strategy,token =  -------------------  *  -------------------"));
    console.log(padLine("|                       TotalAmount            max(1, Risk)^β"));
  }
  printDivision()
  console.log("\n");
}

// ============================== Token Weight Summary ==============================

const formatBalance = (balance: number, tokenSymbol: string) => `${(balance).toLocaleString()} ${tokenSymbol}`
export const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`
const formatWeight = (value: number) => `${value.toExponential(2)}%`

export function logTokenWeightTable(bAppToken: BAppToken, strategies: Strategy[], totalBAppAmount: number, weights: Map<StrategyID, number>): void {

  const tokenSymbol = tokenMap[bAppToken.address.toLowerCase()].symbol || bAppToken.address

  const tokenTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Balance', alignment: 'right', color: 'green' },
      { name: 'Obligation (%)', alignment: 'right', color: 'cyan' },
      { name: 'Obligated Balance', alignment: 'right', color: 'yellow' },
      { name: 'Obligation Participation (%)', alignment: 'right', color: 'blue' },
      { name: 'Risk', alignment: 'right', color: 'magenta' },
      { name: 'Weight', alignment: 'right', color: 'green' },
      { name: 'Norm. Weight (%)', alignment: 'right', color: 'yellow' },
    ],
    title: `💲 BApp Token Weight Summary for ${tokenSymbol} (β = ${bAppToken.sharedRiskLevel})`,
  })

  var weightSum = 0
  for (const [strategy, weight] of weights.entries()) {
    weightSum += weight
  }


  for (const strategy of strategies) {
    const strategyToken = getStrategyToken(strategy, bAppToken.address)
    const obligatedBalance = (strategyToken.amount * strategyToken.obligationPercentage)
    const weight = weights.get(strategy.id)!

    tokenTable.addRow({
      Strategy: strategy.id,
      Balance: formatBalance(strategyToken.amount, tokenSymbol),
      'Obligation (%)': formatPercentage(strategyToken.obligationPercentage),
      'Obligated Balance': formatBalance(obligatedBalance, tokenSymbol),
      'Obligation Participation (%)': formatPercentage(obligatedBalance / totalBAppAmount),
      Risk: formatPercentage(strategyToken.risk),
      Weight: formatWeight(weight),
      'Norm. Weight (%)': formatPercentage(weight / weightSum),
    })
  }

  tokenTable.printTable()
}


export function logValidatorBalanceTable(strategies: Strategy[]): void {
  console.log('\n')

  const validatorTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Validator Balance', alignment: 'right', color: 'green' },
      { name: 'Weight (%)', alignment: 'right', color: 'yellow' },
    ],
    title: '🔑 Validator Weights (No risk, β = 0)',
  })

  const totalValidatorBalance = strategies.reduce((acc, s) => acc + s.validatorBalance, 0)

  strategies.forEach((strategy) => {
    const weight = totalValidatorBalance > 0 ? (strategy.validatorBalance / totalValidatorBalance) * 100 : 0

    validatorTable.addRow({
      Strategy: strategy.id,
      'Validator Balance': `${strategy.validatorBalance.toLocaleString()} ETH`,
      'Weight (%)': `${weight.toFixed(2)}%`,
    })
  })

  validatorTable.addRow(
    {
      Strategy: 'TOTAL',
      'Validator Balance': `${totalValidatorBalance.toLocaleString()} ETH`,
      'Weight (%)': '100.00%',
    },
    { color: 'yellow' },
  )

  validatorTable.printTable()
  console.log('\n')
}

export function logNormalizedFinalWeights(
  finalWeights: Map<StrategyID, number>,
  rawWeights: Map<StrategyID, number>,
): void {
  const weightTable = new Table({
    columns: [
      { name: 'Strategy', alignment: 'center', color: 'blue' },
      { name: 'Raw Weight', alignment: 'right', color: 'red' },
      { name: 'Norm. Weight (%)', alignment: 'right', color: 'yellow' },
    ],
    title: '📊 Normalized Final Weights',
  })

  for (const [strategy, weight] of finalWeights.entries()) {
    weightTable.addRow({
      Strategy: strategy,
      'Raw Weight': formatWeight(rawWeights.get(strategy)!),
      'Norm. Weight (%)': formatPercentage(weight),
    })
  }

  weightTable.printTable()
  console.log('\n')
}

// ============================== Logging Utilities ==============================

export function logFinalWeight(message: string): void {
  const color = getColorForFinalWeight()
  console.log(`${color}[⚖️ Final Weight]${colorReset()} ${message}`)
}

export function logFinalWeightStrategy(strategy: StrategyID, message: string): void {
  logFinalWeight(`${getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${colorReset()} ${message}`)
}

export function getColorForToken(token: string): string {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    hash = token.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

export function getColorForValidatorBalance(): string {
  return CYAN
}

export function getColorForFinalWeight(): string {
  return MAGENTA
}

export function getColorForStrategy(id: number): string {
  return colors[Number(id) % colors.length]
}

export function colorReset(): string {
  return RESET
}

export function logStrategy(id: StrategyID, message: string): void {
  const color = getColorForStrategy(id)
  console.log(`${color}[🧍strategy ${id}] ${colorReset()} ${message}`)
}

export function refParticipant(id: StrategyID): string {
  const color = getColorForStrategy(id)
  return `${color}S${id}${colorReset()}`
}
