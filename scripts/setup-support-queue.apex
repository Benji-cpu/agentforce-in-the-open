// Run once with an admin: ./sf apex run --file scripts/setup-support-queue.apex -o agentforce-de
// Gives the demo agent read access to its queued records and the operator a queue to review.
Group queue=[SELECT Id FROM Group WHERE DeveloperName='Northaven_Support' AND Type='Queue'];
Set<Id> members=new Set<Id>{UserInfo.getUserId()};
for(User u:[SELECT Id FROM User WHERE Username LIKE 'northaven_support_agent@%' AND IsActive=true]) members.add(u.Id);
for(GroupMember m:[SELECT UserOrGroupId FROM GroupMember WHERE GroupId=:queue.Id]) members.remove(m.UserOrGroupId);
List<GroupMember> additions=new List<GroupMember>();
for(Id member:members) additions.add(new GroupMember(GroupId=queue.Id,UserOrGroupId=member));
insert additions;
System.debug('Northaven demo queue membership configured. Email notifications remain off.');
