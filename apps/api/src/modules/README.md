# Feature module pattern

`auth/` and `residents/` are the initial vertical slices. New domains belong in their own folder and should add only the responsibilities they need:

```text
<domain>/
  <domain>.model.js
  <domain>.routes.js
  <domain>.controller.js
  <domain>.service.js
  <domain>.repository.js
  <domain>.validation.js
  <domain>.permissions.js
  <domain>.mapper.js
  <domain>.test.js
```

Keep business rules in services, database access in repositories, and tenant/permission middleware on every society-owned route.