<script setup>
import NavItem from "@/components/NavItem.vue";

import FoodIcon from "~icons/fluent/food-16-filled";
import SearchIcon from "~icons/ant-design/search-outlined";

<template>
  <div class="nav-items">
    <NavItem
      route-name="reservations"
      text="Reservations"
      :requires-auth="true"
    >
      <template #icon>
        <HeatmapIcon />
      </template>
    </NavItem>
    <NavItem route-name="new-reservation" text="New Reservation">
      <template #icon>
        <FoodIcon />
      </template>
    </NavItem>
    <NavItem route-name="search" text="Search" :requires-auth="true">
      <template #icon>
        <SearchIcon />
      </template>
    </NavItem>
    <NavItem
      route-name="admin-settings"
      text="Settings"
      :requires-auth="true"
      :requires-admin="true"
    >
      <template #icon>
        <SettingsIcon />
      </template>
    </NavItem>
    <NavItem route-name="schedule" text="Schedule" :requires-auth="true">
      <template #icon>
        <CalendarIcon />
      </template>
    </NavItem>
    <NavItem route-name="calendar" text="Calendar" :requires-auth="true">
      <template #icon>
        <CalendarIcon />
      </template>
    </NavItem>
    <NavItem route-name="table-management" text="Tables" :requires-auth="true">
      <template #icon>
        <TableIcon />
      </template>
    </NavItem>
    <NavItem route-name="staff-management" text="Staff" :requires-auth="true">
      <template #icon>
        <StaffIcon />
      </template>
    </NavItem>
    <NavItem route-name="role-management" text="Roles" :requires-auth="true">
      <template #icon>
        <RolesIcon />
      </template>
    </NavItem>
    <NavItem route-name="group-management" text="Groups" :requires-auth="true">
      <template #icon>
        <GroupIcon />
      </template>
    </NavItem>
    <NavItem route-name="audit-logs" text="Audit" :requires-auth="true">
      <template #icon>
        <AuditIcon />
      </template>
    </NavItem>
    <NavItem route-name="reports" text="Reports" :requires-auth="true">
      <template #icon>
        <ReportsIcon />
      </template>
    </NavItem>
    <NavItem route-name="floor-plan" text="Floor Plan" :requires-auth="true">
      <template #icon>
        <FloorPlanIcon />
      </template>
    </NavItem>
    <NavItem route-name="waitlist" text="Waitlist" :requires-auth="true">
      <template #icon>
        <WaitlistIcon />
      </template>
    </NavItem>
    <NavItem route-name="heatmap" text="Heatmap" :requires-auth="true">
      <template #icon>
        <ReportsIcon />
      </template>
    </NavItem>
    <NavItem
      route-name="payment-dashboard"
      text="Payments"
      :requires-auth="true"
      :requires-admin="true"
    >
      <template #icon>
        <PaymentsIcon />
      </template>
    </NavItem>
  </div>
</template>

<style scoped>
.nav-items {
  display: flex;
  font-family: "Montserrat-Medium";
  font-weight: normal;
  justify-content: space-around;
  gap: 20px;
  align-items: center;
}
@media screen and (min-width: 1024px) {
  .nav-items {
    gap: 35px;
  }
}
</style>
