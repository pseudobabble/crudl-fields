/* globals jest, describe, test, expect */
import React from 'react'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import _ from 'lodash'

import Dropdown from '../../components/Dropdown'
import { inv, testInvariants } from '../utils/testInvariants'

Enzyme.configure({ adapter: new Adapter() })

const isControlled = prop => !_.isNil(prop)

const event = evt => ({
    stopPropagation: jest.fn,
    preventDefault: jest.fn,
    ...evt,
})

describe('Dropdown expand/collapse', () => {
    const propDomains = {
        tabIndex: [undefined, 0, -1],
        disabled: [undefined, true, false],
        expanded: [undefined, true, false],
        defaultExpanded: [undefined, true, false],
        collapseOnEscape: [undefined, true, false],
        collapseOnBlur: [undefined, true, false],
        expandOnFocus: [undefined, true, false],
    }

    const createElement = props => Enzyme.shallow((
        <Dropdown {...props} >
            <Dropdown.Header />
            <Dropdown.Content>
                <Dropdown.Options>
                    <Dropdown.Option>1</Dropdown.Option>
                    <Dropdown.Option>2</Dropdown.Option>
                    <Dropdown.Option>3</Dropdown.Option>
                </Dropdown.Options>
            </Dropdown.Content>
        </Dropdown>
    ))

    const invariants = [
        inv('expanded controlled correctly', (elm) => {
            const props = elm.instance().props
            if (isControlled(props.expanded)) {
                expect(elm.is('[aria-expanded="true"]')).toBe(props.expanded)
                elm.instance().expand()
                elm.update()
                expect(elm.is('[aria-expanded="true"]')).toBe(props.expanded)
                elm.instance().collapse()
                elm.update()
                expect(elm.is('[aria-expanded="true"]')).toBe(props.expanded)
            }
        }),
        inv('collapseOnEscape works correctly', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.expanded)) {
                if (props.collapseOnEscape === true) {
                    elm.simulate('keyDown', event({ keyCode: 27 }))
                    expect(elm.is('[aria-expanded="false"]')).toBe(true)
                } else {
                    // It does not change the previous state
                    const wasExpanded = elm.is('[aria-expanded="true"]')
                    elm.simulate('keyDown', event({ keyCode: 27 }))
                    expect(elm.is('[aria-expanded="true"]')).toBe(wasExpanded)
                }
            }
        }),
        inv('collapseOnBlur works correctly', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.expanded)) {
                if (props.collapseOnBlur === true) {
                    elm.simulate('blur', event())
                    expect(elm.is('[aria-expanded="false"]')).toBe(true)
                } else {
                    // It does not change the previous state
                    const wasExpanded = elm.is('[aria-expanded="true"]')
                    elm.simulate('blur', event())
                    expect(elm.is('[aria-expanded="true"]')).toBe(wasExpanded)
                }
            }
        }),
        inv('onExpand and onCollapse invoked correctly', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.expanded)) {
                const handleExpand = jest.fn()
                const handleCollapse = jest.fn()
                elm.setProps({ onExpand: handleExpand, onCollapse: handleCollapse })
                elm.instance().expand()
                elm.instance().collapse()
                expect(handleExpand.mock.calls.length).toBe(1)
                expect(handleCollapse.mock.calls.length).toBe(1)
            }
        }),
        inv('Header toggles the dropdown\'s expanded state', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.expanded)) {
                elm.simulate('focus', event())
                const wasExpanded = elm.is('[aria-expanded="true"]')
                elm.find(Dropdown.Header).simulate('click', event())
                expect(elm.is('[aria-expanded="true"]')).not.toBe(wasExpanded)
            }
        }),
        inv('expandOnFocus works correctly', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.expanded)) {
                if (props.expandOnFocus === true) {
                    elm.simulate('focus', event())
                    expect(elm.is('[aria-expanded="true"]')).toBe(true)
                } else {
                    // It does not change the previous state
                    const wasExpanded = elm.is('[aria-expanded="true"]')
                    elm.simulate('focus', event())
                    expect(elm.is('[aria-expanded="true"]')).toBe(wasExpanded)
                }
            }
        }),
    ]

    testInvariants(createElement, invariants, propDomains)
})

describe('Dropdown focus', () => {
    const propDomains = {
        tabIndex: [undefined, -1, 0, 1],
        disabled: [undefined, true, false],
    }

    const createElement = props => Enzyme.shallow((
        <Dropdown {...props} >
            <Dropdown.Header />
            <Dropdown.Content>
                <Dropdown.Options>
                    <Dropdown.Option>1</Dropdown.Option>
                    <Dropdown.Option>2</Dropdown.Option>
                    <Dropdown.Option>3</Dropdown.Option>
                </Dropdown.Options>
            </Dropdown.Content>
        </Dropdown>
    ))

    const invariants = [
        inv('tabIndex controlled properly', (elm) => {
            const props = elm.instance().props
            if (props.disabled) {
                // When disabled
                expect(elm.is('[tabIndex=-1]')).toBe(true)
                return
            }
            if (!_.isNil(props.tabIndex)) {
                // Controlled
                expect(elm.is(`[tabIndex=${props.tabIndex}]`)).toBe(true)
            } else {
                // Default value
                expect(elm.is('[tabIndex=-1]')).toBe(true)
            }
        }),
        inv('onFocus and onBlur invoked correctly', (elm) => {
            const handleFocus = jest.fn()
            const handleBlur = jest.fn()
            elm.setProps({ onFocus: handleFocus, onBlur: handleBlur })
            elm.simulate('focus', event())
            elm.simulate('blur', event())
            expect(handleFocus.mock.calls.length).toBe(1)
            expect(handleBlur.mock.calls.length).toBe(1)
        }),
    ]

    testInvariants(createElement, invariants, propDomains)
})

describe('Dropdown value & check/uncheck', () => {
    const propDomains = {
        disabled: [undefined, true, false],
        value: [
            undefined, // Not controlled
            '1', // Valid value
            'X', // Invalid value
            [], // Valid but empty multiple
            ['1', '2'], // Valid multiple
            ['X', 'Y'], // Invalid multiple
        ],
        defaultValue: [undefined, '3'],
        multiple: [undefined, true, false],
    }

    const createElement = props => Enzyme.shallow((
        <Dropdown {...props} >
            <Dropdown.Header />
            <Dropdown.Content>
                <Dropdown.Options>
                    <Dropdown.Option id="opt1">1</Dropdown.Option>
                    <Dropdown.Option id="opt2">2</Dropdown.Option>
                    <Dropdown.Option id="opt3">3</Dropdown.Option>
                    <Dropdown.Option id="opt4" selected >4</Dropdown.Option>
                </Dropdown.Options>
            </Dropdown.Content>
        </Dropdown>
    ))

    const invariants = [
        inv('state variable \'value\' is always an array when multi-selectable', (elm) => {
            const props = elm.instance().props
            if (
                !isControlled(props.value) &&
                !isControlled(props.defaultValue) &&
                props.multiple
            ) {
                expect(_.isArray(elm.state('value'))).toBe(true)
                elm.instance().check(null, 'x')
                elm.update()
                expect(_.isArray(elm.state('value'))).toBe(true)
            }
        }),
        inv('value is controlled correctly', (elm) => {
            const props = elm.instance().props
            if (isControlled(props.value)) {
                elm.instance().check(null, 'x')
                elm.update()
                expect(elm.state('value')).toEqual(props.value)
            }
        }),
        inv('defaultValue works properly', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.value) && props.defaultValue) {
                // Must be the same
                expect(elm.state('value')).toEqual(props.defaultValue)
            }
        }),
        inv('option gets selected', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.value)) {
                // Get the options that are not selected
                const notCheckedOptions = elm.find({ selected: false })
                // Don't test if none found
                if (!notCheckedOptions.exists()) return
                // Get the first selected option
                const option = notCheckedOptions.first()
                // Try to uncheck it
                option.simulate('click', event(), option.props())
                // Test depending on whether the dropdown allows for multiple selections
                if (props.multiple) {
                    expect(elm.state('value')).toContain(option.prop('value'))
                } else {
                    expect(elm.state('value')).toBe(option.prop('value'))
                }
            }
        }),
        inv('option gets unchecked', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.value) && !isControlled(props.defaultValue)) {
                // Get the selected options
                const checkedOptions = elm.find({ selected: true })
                // Don't test if none found
                if (!checkedOptions.exists()) return
                // Allow unchecking checked options
                elm.setProps({
                    allowToggle: true,
                })
                // Get the first selected option
                const option = checkedOptions.first()
                // Try to uncheck it
                option.simulate('click', event(), option.props())
                // Test depending on whether the dropdown allows multiple selection or not
                if (props.multiple) {
                    expect(elm.state('value')).not.toContain(option.prop('value'))
                } else {
                    expect(elm.state('value')).not.toEqual(expect.anything())
                }
            }
        }),
        inv('Include bubl-dropdown_has-selected-options', (elm) => {
            const props = elm.instance().props
            if (props.value && (!_.isArray(props.value) || props.value.length > 0)) {
                expect(elm.prop('className')).toMatch(/bubl-dropdown_has-selected-options/)
            }
        }),
        inv('Clear sets the value to [] or null', (elm) => {
            const props = elm.instance().props
            const handleChange = jest.fn()
            elm.setProps({ onChange: handleChange })
            elm.find(Dropdown.Header).simulate('clear')
            expect(handleChange).toBeCalledWith(props.multiple ? [] : null)
            if (!isControlled(props.value)) {
                expect(elm.state('value')).toEqual(props.multiple ? [] : null)
            }
        }),
    ]

    testInvariants(createElement, invariants, propDomains)
})

describe('Dropdown rendering and default props', () => {
    test('Mounts without error', () => {
        Enzyme.mount(<Dropdown />)
    })
    test('Includes className', () => {
        const elm = Enzyme.shallow(<Dropdown className="test-class" />)
        expect(elm.prop('className')).toMatch(/test-class/)
    })
    test('Default value of multiple', () => {
        const elm = Enzyme.shallow(<Dropdown />)
        const props = elm.instance().props
        expect(props.multiple).toBe(false)
    })
    test('Default value of scrolling', () => {
        const elm = Enzyme.shallow(<Dropdown />)
        const props = elm.instance().props
        expect(props.scrolling).toBe(true)
    })
    test('Default value of options', () => {
        const elm = Enzyme.shallow(<Dropdown />)
        const props = elm.instance().props
        expect(props.options).toEqual([])
    })
    test('Default value of expandOnFocus', () => {
        const elm = Enzyme.shallow(<Dropdown />)
        const props = elm.instance().props
        expect(props.expandOnFocus).toBe(true)
    })
    test('Default value of collapseOnEscape', () => {
        const elm = Enzyme.shallow(<Dropdown />)
        const props = elm.instance().props
        expect(props.collapseOnEscape).toBe(true)
    })
    test('Corrects tabIndex', () => {
        const elm = Enzyme.shallow(
            <Dropdown>
                <Dropdown.Content>
                    <Dropdown.Option>1</Dropdown.Option>
                    <Dropdown.Option>2</Dropdown.Option>
                </Dropdown.Content>
            </Dropdown>,
        )
        expect(elm.is('[tabIndex=0]')).toBe(true)
    })
})

describe('Dropdown and Header', () => {
    test('Sets title correctly', () => {
        const elm = Enzyme.shallow(
            <Dropdown>
                <Dropdown.Content>
                    <Dropdown.Option>1</Dropdown.Option>
                    <Dropdown.Option>2</Dropdown.Option>
                </Dropdown.Content>
            </Dropdown>,
        )
        expect(elm.is('[tabIndex=0]')).toBe(true)
    })
})
