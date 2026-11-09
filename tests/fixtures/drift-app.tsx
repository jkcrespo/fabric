// A deliberately drifting app screen: used to test the lint rules and drift score.
import { Box, Button, TextField, Typography } from '@mui/material';
import { Card } from '@jkcrespo/fabric-react';

export function Settings() {
  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Typography variant="h5" sx={{ textTransform: 'uppercase', color: '#334155' }}>
        Settings
      </Typography>
      <Card title="Profile" sx={(t) => ({ mb: t.fabric.space.betweenSections })}>
        <TextField placeholder="Email" />
        <Box style={{ padding: '15px', borderRadius: 6, fontSize: 13 }}>Note</Box>
      </Card>
      <Box sx={(t) => ({ color: t.fabric.color.text.subtle, bgcolor: 'background.paper', borderRadius: t.fabric.radius.cardMd })}>
        Footer
      </Box>
      <Button sx={{ mt: 2, background: 'var(--fabric-color-primary-bg)' }}>Save</Button>
    </Box>
  );
}
