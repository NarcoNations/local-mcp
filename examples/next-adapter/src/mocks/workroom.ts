import { WorkroomLane } from '../types/systems';

export const mockWorkroomLanes: WorkroomLane[] = [
  {
    id: 'lane-discovery',
    title: 'Discovery',
    stickies: [
      { id: 'sticky-1', laneId: 'lane-discovery', text: 'Interview ops about drop 17 needs.', color: 'cyan' },
      { id: 'sticky-2', laneId: 'lane-discovery', text: 'Collect hardware constraints from labs.', color: 'gold' },
    ],
  },
  {
    id: 'lane-design',
    title: 'Design',
    stickies: [
      { id: 'sticky-3', laneId: 'lane-design', text: 'Draft hero narrative storyboard.', color: 'rose' },
      { id: 'sticky-4', laneId: 'lane-design', text: 'Prototype mission dashboard UI.', color: 'cyan' },
    ],
  },
  {
    id: 'lane-delivery',
    title: 'Delivery',
    stickies: [
      { id: 'sticky-5', laneId: 'lane-delivery', text: 'QA ingest pipeline transforms.', color: 'gold' },
      { id: 'sticky-6', laneId: 'lane-delivery', text: 'Ship MVP brief to ops channel.', color: 'rose' },
    ],
  },
];
