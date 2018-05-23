/* globals jest, describe, test, expect */
import React from 'react'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import _ from 'lodash'

import Checkbox from '../../components/Checkbox'
import { inv, testInvariants } from '../utils/testInvariants'

Enzyme.configure({ adapter: new Adapter() })

/** available actions */
const actions = {
    click: elm => elm.find('div').simulate('click'),
    pressSpace: elm => elm.simulate('keydown', { keyCode: 32, preventDefault: () => null }),
}

/** Checkbox prop domains */
const propDomains = {
    value: [undefined, true, false],
    defaultChecked: [undefined, true, false],
    className: [undefined, 'test-class'],
}

describe('Checkbox invariants', () => {
    const handleClick = jest.fn()
    const handleKeyDown = jest.fn()

    const createElement = props => Enzyme.shallow(React.createElement(Checkbox, {
        ...props,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
    }))

    const invariants = [
        inv('state variable \'value\' is true or false', (elm) => {
            expect(typeof elm.state('value')).toBe('boolean')
        }),
        inv('value is controlled correctly', (elm) => {
            const props = elm.instance().props
            if (_.isBoolean(props.value)) {
                expect(elm.state('value')).toEqual(props.value)
                elm.setProps({ value: !props.value })
                expect(elm.state('value')).toEqual(!props.value)
            }
        }),
        inv('default value works correctly', (elm, inputProps, as) => {
            const props = elm.instance().props
            if (as.empty && props.value === undefined && _.isBoolean(props.defaultChecked)) {
                expect(as.elm.state('value')).toEqual(props.defaultChecked)
            }
        }),
        inv('keyDown handler invoked', (elm, inputProps, as) => {
            if (as.pressSpace.executed) {
                expect(handleKeyDown.mock.calls.length).toBeGreaterThan(0)
            }
        }),
        inv('onClick handler invoked', (elm, inputProps, as) => {
            if (as.click.executed) {
                expect(handleClick.mock.calls.length).toBeGreaterThan(0)
            }
        }),
        inv('gets value on space key', (elm, inputProps, as) => {
            const props = elm.instance().props
            if (props.value === undefined && as.pressSpace.executed) {
                const elmBefore = as.pressSpace.elementBefore
                const elmAfter = as.pressSpace.elementAfter
                try {
                    expect(elmBefore.state('value')).not.toBe(elmAfter.state('value'))
                } catch (e) {
                    throw e
                }
            }
        }),
        inv('includes className', (elm) => {
            const props = elm.instance().props
            if (props.className) {
                expect(elm.prop('className')).toMatch(/test-class/)
            }
        }),
    ]

    testInvariants(createElement, invariants, propDomains, actions)
})

describe('<Checkbox />', () => {
    test('Mounts without error', () => {
        Enzyme.mount(<Checkbox />)
    })
    test('Renders children', () => {
        const elm = Enzyme.shallow(
            <Checkbox>
                <span id="child-1" />
                <span id="child-2" />
            </Checkbox>,
        )
        expect(elm.find('#child-1').html()).toBe('<span id="child-1"></span>')
        expect(elm.find('#child-2').html()).toBe('<span id="child-2"></span>')
    })
})
