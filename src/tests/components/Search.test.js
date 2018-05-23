/* globals jest, describe, test, expect */
import React from 'react'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'
import _ from 'lodash'

import { Search, Button } from '../../components'
import { inv, testInvariants } from '../utils/testInvariants'

Enzyme.configure({ adapter: new Adapter() })

const isControlled = prop => !_.isNil(prop)

describe('Search value', () => {
    const propDomains = {
        value: [undefined, '', 'search query'],
        defaultValue: [undefined, '', 'default search query'],
    }

    const createElement = props => Enzyme.shallow(<Search {...props} />)

    const invariants = [
        inv('value controlled correctly', (elm) => {
            const props = elm.instance().props
            if (isControlled(props.value)) {
                expect(elm.state('value')).toBe(props.value)
            }
            elm.setProps({ value: 'Another query' })
            expect(elm.state('value')).toBe('Another query')
            elm.simulate('change', {}, 'Should not be set')
            expect(elm.state('value')).not.toBe('Should not be set')
        }),

        inv('default value works correctly', (elm) => {
            const props = elm.instance().props
            if (!isControlled(props.value) && isControlled(props.defaultValue)) {
                expect(elm.state('value')).toBe(props.defaultValue)
            }
            elm.setProps({ defaultValue: 'Another query' })
            expect(elm.state('value')).not.toBe('Another query')
        }),
    ]

    testInvariants(createElement, invariants, propDomains)
})

describe('Search actions and handlers', () => {
    test('Enter triggers onSearch', () => {
        const handleSearch = jest.fn()
        const elm = Enzyme.shallow(<Search value="Query" onSearch={handleSearch} />)

        const e = { keyCode: 13 }
        elm.simulate('keyDown', e)

        expect(handleSearch).toBeCalled()
        expect(handleSearch).toBeCalledWith('Query');
    })

    test('Click on clear button triggers onClear and onChange', () => {
        const handleClear = jest.fn()
        const handleChange = jest.fn()
        const elm = Enzyme.shallow(
            <Search value="Query" onClear={handleClear} onChange={handleChange} />,
        )

        elm.find(Button).first().simulate('click', { stopPropagation: jest.fn })
        expect(handleClear).toBeCalled()
        expect(handleChange).toBeCalled(undefined, '')
    })

    test('Clear button clears the state', () => {
        const elm = Enzyme.shallow(<Search />)

        elm.setState({ value: 'XXX' })
        elm.find(Button).first().simulate('click', { stopPropagation: jest.fn })
        expect(elm.state('value')).toBe('')
    })
})


describe('<Search />', () => {
    test('Mounts without error', () => {
        Enzyme.mount(<Search />)
    })
})
