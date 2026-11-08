// Test fixture: a page of real MUI components themed by Fabric.
import '@fontsource-variable/noto-sans';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { Alert, Button, Card, CardContent, Chip, Dialog, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import fabric from '@jkcrespo/fabric-tokens/fabric';
import acme from '@jkcrespo/fabric-tokens/acme';
import { FabricProvider, FabricBrandScope, useColorScheme } from '@jkcrespo/fabric-theme';

const brands = { fabric, acme };
const params = new URLSearchParams(location.search);
const brand = brands[(params.get('brand') ?? 'fabric') as keyof typeof brands];

function ModeBridge() {
  const { mode, setMode } = useColorScheme();
  useEffect(() => {
    (window as any).setMode = setMode;
  }, [setMode]);
  return <span id="mode">{mode}</span>;
}

function Demo() {
  return (
    <Stack spacing={4} sx={{ p: 6, maxWidth: 560 }}>
      <ModeBridge />
      <Typography variant="overline">Fabric · {brand.brand}</Typography>
      <Typography variant="h1" id="h1">Hello</Typography>
      <Typography variant="body1">Body copy uses typography.body-md.</Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" id="btn">Primary</Button>
        <Button variant="outlined" color="secondary">Secondary</Button>
        <Button variant="contained" color="error">Delete</Button>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Chip label="Chip" color="primary" id="chip" />
        <Chip label="Success" color="success" variant="outlined" />
      </Stack>
      <TextField label="Email" helperText="We never share it." id="field" />
      <FormControl>
        <InputLabel id="select-label">Country</InputLabel>
        <Select labelId="select-label" id="select" label="Country" defaultValue="nl">
          <MenuItem value="nl">Netherlands</MenuItem>
        </Select>
      </FormControl>
      <Alert severity="error" id="alert">Something went wrong.</Alert>
      <Card id="card" elevation={1}>
        <CardContent>
          <Typography variant="h5">Card title</Typography>
          <Typography variant="body2" color="text.secondary">Card body on color.surface.raised.</Typography>
        </CardContent>
      </Card>
      <Dialog open title="Dialog" id="dialog" disablePortal hideBackdrop sx={{ position: 'static' }} slotProps={{ paper: { id: 'dialog-paper', elevation: 24 } }} />
      <FabricBrandScope brand={brand === acme ? fabric : acme}>
        <Button variant="contained" id="scoped-btn">Other brand</Button>
      </FabricBrandScope>
    </Stack>
  );
}

createRoot(document.getElementById('root')!).render(
  <FabricProvider brand={brand}>
    <Demo />
  </FabricProvider>
);
