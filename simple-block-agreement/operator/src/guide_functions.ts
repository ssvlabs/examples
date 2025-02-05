
import { address, amount, bAppAddress, percentage, strategyID, token } from "./types";

// API from bApps Platform
interface bAppsPlatformAPI {
    GetbAppTokens(bApp: bAppAddress): Promise<Map<token, number>>;
    GetStrategies(): Promise<strategyID[]>;
    GetStrategyOwnerAccount(strategy: strategyID): Promise<address>;
    GetStrategyOptedInToBApp(ownerAccount: address, bApp: bAppAddress): Promise<strategyID>;
    GetStrategyBalance(strategy: strategyID): Promise<Map<token, amount>>;
    GetObligation(strategy: strategyID, bApp: bAppAddress, token: token): Promise<amount>;
    GetDelegatorsToAccount(account: address): Promise<Map<address, percentage>>;
    AllObligationsForToken(strategy: strategyID, token: token): Promise<Map<bAppAddress, percentage>>;
}

// API from Ethereum Node
interface EthereumNodeAPI {
    GetValidatorBalance(pubKey: string): Promise<{ balance: number, isActive: boolean }>;
}

// API from SSV Node
interface SSVNodeAPI {
    GetValidatorsPubKeys(account: address): Promise<address[]>;
}

// BAppDataFetcher takes on the bApp platform, an Ethereum node, and an SSV node APIs and fetches relevant data
export class BAppDataFetcher {
    private bAppsPlatformAPI: bAppsPlatformAPI;
    private ethereumNodeAPI: EthereumNodeAPI;
    private ssvNodeAPI: SSVNodeAPI;

    constructor(bAppsPlatformAPI: bAppsPlatformAPI, ethereumNodeAPI: EthereumNodeAPI, ssvNodeAPI: SSVNodeAPI) {
        this.bAppsPlatformAPI = bAppsPlatformAPI;
        this.ethereumNodeAPI = ethereumNodeAPI;
        this.ssvNodeAPI = ssvNodeAPI;
    }

    // Fetches, for each token, the obligated balances per strategy for a bApp
    async fetchObligatedBalances(bApp: bAppAddress): Promise<Map<token, Map<strategyID, amount>>> {

        // initialize the map
        var obligatedBalances = new Map<token, Map<strategyID, amount>>();

        // get the tokens for the bApp
        var bAppTokens = await this.bAppsPlatformAPI.GetbAppTokens(bApp);
        for (const [token, _] of bAppTokens) {
            obligatedBalances.set(token, new Map());
        }

        // look through every strategy
        const strategies = await this.bAppsPlatformAPI.GetStrategies();
        for (const strategy of strategies) {
            // Check if the strategy is opted in to the bApp
            const ownerAccount = await this.bAppsPlatformAPI.GetStrategyOwnerAccount(strategy);
            if (await this.bAppsPlatformAPI.GetStrategyOptedInToBApp(ownerAccount, bApp) !== strategy) {
                continue;
            }

            // Get strategy balance
            const balance = await this.bAppsPlatformAPI.GetStrategyBalance(strategy);

            // Add obligated balances for each bApp token
            for (const [token, _] of bAppTokens) {
                const obligationPercentage = await this.bAppsPlatformAPI.GetObligation(strategy, bApp, token);
                obligatedBalances.get(token)!.set(strategy, obligationPercentage * (balance.get(token) || 0));
            }
        }

        return obligatedBalances;
    }


    // Fetches the operational validator balance per strategy
    async fetchValidatorBalances(bApp: bAppAddress): Promise<Map<strategyID, amount>> {
        const validatorBalances = new Map<strategyID, amount>();

        // look through every strategy
        const strategies = await this.bAppsPlatformAPI.GetStrategies();
        for (const strategy of strategies) {
            // Check if the strategy is opted in to the bApp
            const ownerAccount = await this.bAppsPlatformAPI.GetStrategyOwnerAccount(strategy);
            if (await this.bAppsPlatformAPI.GetStrategyOptedInToBApp(ownerAccount, bApp) !== strategy) {
                continue;
            }

            // store validator balance
            validatorBalances.set(strategy, await this.computeOperationalValidatorBalance(ownerAccount));
        }

        return validatorBalances;
    }

    // Compute the operational validator balance for an account
    private async computeOperationalValidatorBalance(account: string): Promise<number> {
        let total = 0;

        // get all other accounts that delegated to it along with the percentages
        const delegators = await this.bAppsPlatformAPI.GetDelegatorsToAccount(account);

        // add the delegated balances
        for (const [delegator, percentage] of Object.entries(delegators)) {
            total += (await this.getOwnedValidatorBalance(delegator)) * percentage;
        }

        return total;
    }

    // Get the balance of the validators owned by an account
    private async getOwnedValidatorBalance(account: string): Promise<number> {
        let total = 0;

        // get SSV validators from account
        const validatorsPubKeys = await this.ssvNodeAPI.GetValidatorsPubKeys(account);

        for (const pubKey of validatorsPubKeys) {
            // get validator balance and active status
            const { balance, isActive } = await this.ethereumNodeAPI.GetValidatorBalance(pubKey);
            if (isActive) {
                total += balance;
            }
        }

        return total;
    }

    // Fetches, for each bApp token, the risks per strategy
    async fetchRisks(bApp: bAppAddress): Promise<Map<token, Map<strategyID, number>>> {
        const risks = new Map<token, Map<strategyID, number>>();

        // get bApp tokens
        const bAppTokens = await this.bAppsPlatformAPI.GetbAppTokens(bApp);
        for (const [token, _] of bAppTokens) {
            risks.set(token, new Map());
        }

        // loop through every strategy
        const strategies = await this.bAppsPlatformAPI.GetStrategies();
        for (const strategy of strategies) {

            // check if strategy participates in the bApp
            const ownerAccount = await this.bAppsPlatformAPI.GetStrategyOwnerAccount(strategy);
            if (await this.bAppsPlatformAPI.GetStrategyOptedInToBApp(ownerAccount, bApp) !== strategy) {
                continue;
            }

            // compute risk (sum of all obligation percentages)
            for (const [token,_] of bAppTokens) {
                // sum all obligations through all bApps
                var total_obligation = 0;
                for (const [_, obligation] of await this.bAppsPlatformAPI.AllObligationsForToken(strategy, token)) {
                    total_obligation += obligation;
                }

                risks.get(token)!.set(strategy, total_obligation);
            }
        }
        return risks;
    }
}
