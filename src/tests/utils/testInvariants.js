/* globals test */
/* eslint-disable import/no-extraneous-dependencies */
import Combinatorics from 'js-combinatorics'
import chalk from 'chalk'

export const inv = (description, test) => ({ description, test })

const getIndexKey = nameSequence => nameSequence.join('.')

class ActionSequence {
    /** An index of all executed sequences */
    static sequenceIndex = {}

    static clearIndex() {
        ActionSequence.sequenceIndex = {}
    }

    sequence = []
    data = []
    positions = {}
    eval = value => value
    selectedAction = undefined

    constructor(getElement, actions) {
        this.elm = getElement()
        this.actions = actions

        // Define a get property for each action name
        const actionNames = Object.keys(actions)
        actionNames.forEach(actionName =>
            Object.defineProperty(this, actionName, {
                configurable: true,
                enumerable: true,
                get: () => {
                    this.selectedAction = actionName
                    return this
                },
            }),
        )
    }

    execute(...actionNames) {
        if (actionNames.length === 0) {
            ActionSequence.sequenceIndex[getIndexKey([])] = this
            return
        }
        actionNames.forEach((actionName) => {
            const action = this.actions[actionName]
            if (!action) return
            const actionData = action(this.elm) || {}
            // Save the sequence
            this.sequence.push(actionName)
            // Save the action data
            this.data.push(actionData)
            // Save the position (for faster loop up)
            this.positions[actionName] = this.sequence.length - 1
            // Update the index
            const key = getIndexKey(this.sequence)
            if (!ActionSequence.sequenceIndex[key]) {
                ActionSequence.sequenceIndex[key] = this
            }
        })
    }

    position(actionName) {
        const pos = this.positions[actionName]
        return typeof pos !== 'undefined' ? pos : -1
    }

    get empty() {
        return this.sequence.length === 0
    }

    contains(actionName) {
        return this.position(actionName) > -1
    }

    checkActionSelected = () => {
        if (!this.selectedAction) {
            throw new Error('You have to select an action first')
        }
    }

    checkActionSelectedAndExecuted = () => {
        this.checkActionSelected()
        if (!this.contains(this.selectedAction)) {
            throw new Error(`The action ${this.selectedAction} was not executed.`)
        }
    }

    get not() {
        this.eval = value => !value
        return this
    }

    followedBy(actionName) {
        this.checkActionSelected()
        return this.eval(this.position(this.selectedAction) < this.position(actionName))
    }

    followedImmediatelyBy(actionName) {
        this.checkActionSelected()
        return this.eval(this.position(this.selectedAction) === this.position(actionName) - 1)
    }

    get executed() {
        this.checkActionSelected()
        return this.contains(this.selectedAction)
    }

    get isLast() {
        this.checkActionSelected()
        return this.eval(this.position(this.selectedAction) === this.sequence.length)
    }

    get isFirst() {
        this.checkActionSelected()
        return this.eval(this.position(this.selectedAction) === 0)
    }

    get last() {
        if (this.empty) return this
        this.selectedAction = this.sequence[this.sequence.length - 1]
        return this
    }

    get first() {
        if (this.empty) return this
        this.selectedAction = this.sequence[0]
        return this
    }

    get elementAfter() {
        this.checkActionSelectedAndExecuted()
        const pos = this.position(this.selectedAction)
        const key = getIndexKey(this.sequence.slice(0, pos + 1))
        return ActionSequence.sequenceIndex[key].elm
    }

    get elementBefore() {
        this.checkActionSelectedAndExecuted()
        const pos = this.position(this.selectedAction)
        const key = getIndexKey(this.sequence.slice(0, pos))
        return ActionSequence.sequenceIndex[key].elm
    }

    get(dataKey) {
        this.checkActionSelectedAndExecuted()
        return this.data[this.position(this.selectedAction)][dataKey]
    }
}

export const testInvariants = (createElement, invariants, propDomains = {}, actions = {}) => {
    //
    // Generate sequences of action names
    const actionNames = Object.keys(actions)
    let actionNamesPermutations = [[]]
    if (actionNames.length > 0) {
        actionNamesPermutations = actionNamesPermutations.concat(
            Combinatorics.permutationCombination(actionNames).toArray(),
        )
    }

    //
    // Generate prop space
    const propNames = Object.keys(propDomains)
    let propSpace = [[]]
    if (propNames.length > 0) {
        propSpace = propSpace.concat(
            Combinatorics.cartesianProduct(...propNames.map(
                propName => propDomains[propName],
            )).toArray(),
        )
    }

    //
    // Execute a test for each invariant
    invariants.forEach(invariant => test(invariant.description, () => {
        for (let i = 0; i < propSpace.length; i += 1) {
            //
            // Create props object
            const props = propNames.reduce((acc, propName, index) => ({
                ...acc,
                [propName]: propSpace[i][index],
            }), {})

            //
            // Clear index for each new prop configuration
            ActionSequence.clearIndex()

            //
            // For each action sequence and each prop configuration invoke the test
            for (let j = 0; j < actionNamesPermutations.length; j += 1) {
                //
                // Create and execute the action sequence
                const actionSequence = new ActionSequence(() => createElement(props), actions)
                actionSequence.execute(...actionNamesPermutations[j])

                //
                // Test the invariant
                try {
                    invariant.test(actionSequence.elm, props, actionSequence)
                } catch (e) {
                    throw new Error(
                        'Invariant failed for\n' +
                        `actions: ${chalk.magenta(JSON.stringify(actionSequence.sequence))}\n` +
                        `props: ${chalk.magenta(JSON.stringify(props, null, 2))}\n\n` +
                        `${e.message}`,
                    )
                }
            }
        }
    }))
}
