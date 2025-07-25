// admin/keystone.tsximport { render } from 'react-dom';
import React from "react";
import { AdminUIProvider, FieldViews, Core } from "@keystone-6/core/admin-ui";
import customFields from "./customFields";
import ViewEpisodesButton from "./components/ViewEpisodesButton";

const customFieldViews = {
  ...FieldViews,
  viewEpisodesButton: ViewEpisodesButton,
};

const App = () => (
  <AdminUIProvider
    fieldViews={customFieldViews}
    // Pass other necessary props like lists, admin meta, etc.
  >
    <Core />
  </AdminUIProvider>
);

render(<App />, document.getElementById("root"));
