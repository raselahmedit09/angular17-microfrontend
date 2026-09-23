export * from './leaveAllocation.service';
import { LeaveAllocationService } from './leaveAllocation.service';
export * from './leaveRequests.service';
import { LeaveRequestsService } from './leaveRequests.service';
export * from './leaveTypes.service';
import { LeaveTypesService } from './leaveTypes.service';
export const APIS = [LeaveAllocationService, LeaveRequestsService, LeaveTypesService];
