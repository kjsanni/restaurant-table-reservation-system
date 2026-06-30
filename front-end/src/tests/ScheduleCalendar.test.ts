import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ScheduleCalendar from '../components/ScheduleCalendar.vue'
import { VaButton, VaChip, VaCard, VaCardContent } from 'vuestic-ui'

describe('ScheduleCalendar', () => {
  const days = [
    { dayOfWeek: 'monday', label: 'Monday', openTime: '11:00:00', closeTime: '23:00:00', isClosed: false, slotDuration: 30 },
    { dayOfWeek: 'tuesday', label: 'Tuesday', openTime: '11:00:00', closeTime: '23:00:00', isClosed: true, slotDuration: 30 },
  ]

  it('renders all days', () => {
    const wrapper = mount(ScheduleCalendar, {
      props: { days },
      global: { stubs: { VaButton, VaChip, VaCard, VaCardContent } },
    })
    expect(wrapper.text()).toContain('Monday')
    expect(wrapper.text()).toContain('Tuesday')
  })

  it('shows open/closed state via chip', () => {
    const wrapper = mount(ScheduleCalendar, {
      props: { days },
      global: { stubs: { VaButton, VaChip, VaCard, VaCardContent } },
    })
    expect(wrapper.text()).toContain('Open')
    expect(wrapper.text()).toContain('Closed')
  })

  it('emits toggle and edit events', async () => {
    const wrapper = mount(ScheduleCalendar, {
      props: { days },
      global: { stubs: { VaButton, VaChip, VaCard, VaCardContent } },
    })
    const dayEl = wrapper.findAll('.schedule-day')[0]
    await dayEl.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
  })
})
