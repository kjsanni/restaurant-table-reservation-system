import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import TimeSlotGrid from '../components/TimeSlotGrid.vue'
import { VaButton, VaCard, VaChip } from 'vuestic-ui'

describe('TimeSlotGrid', () => {
  const slots = [
    { time: '14:00', available: true, reserved: false },
    { time: '15:00', available: true, reserved: true },
    { time: '16:00', available: false, reserved: false },
  ]

  it('renders all slots', () => {
    const wrapper = mount(TimeSlotGrid, {
      props: { slots },
      global: { stubs: { VaButton, VaCard, VaChip } },
    })
    expect(wrapper.text()).toContain('14:00')
    expect(wrapper.text()).toContain('15:00')
    expect(wrapper.text()).toContain('16:00')
  })

  it('emits update:modelValue when an available slot is clicked', async () => {
    const wrapper = mount(TimeSlotGrid, {
      props: { slots },
      global: { stubs: { VaButton, VaCard, VaChip } },
    })
    await wrapper.findComponent(VaButton).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([
      { time: '14:00', available: true, reserved: false },
    ])
  })

  it('does not emit when clicking a reserved slot', async () => {
    const wrapper = mount(TimeSlotGrid, {
      props: { slots },
      global: { stubs: { VaButton, VaCard, VaChip } },
    })
    const buttons = wrapper.findAllComponents(VaButton)
    await buttons[1].trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})
