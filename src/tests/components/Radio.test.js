/* globals jest, describe, test, expect */
import React from 'react'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import _ from 'lodash'

import Radio from '../../components/Radio'
import { inv, testInvariants } from '../utils/testInvariants'

Enzyme.configure({ adapter: new Adapter() })

describe('Radio invariants', () => {
    const handleClick = jest.fn()
    const handleKeyDown = jest.fn()

    const actions = {
        click: elm => elm.simulate('click'),
        pressSpace: elm => elm.simulate('keydown', { keyCode: 32, preventDefault: () => null }),
    }

    const propDomains = {
        value: [undefined, 'radio value'],
        checked: [undefined, true, false],
        defaultChecked: [undefined, true, false],
        className: [undefined, 'test-class'],
    }

    const createElement = props => Enzyme.shallow(React.createElement(Radio, {
        ...props,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
    }))

    const invariants = [
        inv('state variable \'checked\' is true or false', (elm) => {
            expect(typeof elm.state('checked')).toBe('boolean')
        }),
        inv('checked is controlled correctly', (elm) => {
            const props = elm.instance().props
            if (_.isBoolean(props.checked)) {
                expect(elm.state('checked')).toEqual(props.checked)
            }
            elm.setProps({ checked: !props.checked })
            expect(elm.state('checked')).toEqual(!props.checked)
        }),
        inv('default checked works correctly', (elm, inputProps, as) => {
            const props = elm.instance().props
            if (as.empty && props.checked === undefined && _.isBoolean(props.defaultChecked)) {
                expect(as.elm.state('checked')).toEqual(props.defaultChecked)
            }
        }),
        inv('keyDown handler invoked', (elm, inputProps, as) => {
            if (as.pressSpace.executed) {
                expect(handleKeyDown.mock.calls.length).toBeGreaterThan(0)
            }
        }),
        inv('onClick handler invoked', (elm, inputProps, as) => {
            if (as.click.executed) {
                expect(handleClick).toBeCalled()
            }
        }),
        inv('gets checked on space key', (elm, inputProps, as) => {
            const props = elm.instance().props
            if (props.checked === undefined && as.pressSpace.executed) {
                expect(elm.state('checked')).toBe(true)
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

describe('<Radio />', () => {
    test('Mounts without error', () => {
        Enzyme.mount(<Radio />)
    })
    test('Renders children', () => {
        const elm = Enzyme.shallow(
            <Radio>
                <span id="child-1" />
                <span id="child-2" />
            </Radio>,
        )
        expect(elm.find('#child-1').html()).toBe('<span id="child-1"></span>')
        expect(elm.find('#child-2').html()).toBe('<span id="child-2"></span>')
    })
})
